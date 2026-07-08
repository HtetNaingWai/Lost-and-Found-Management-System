<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Item::query()
            ->with(['user:id,name,email', 'category:id,name', 'approvedBy:id,name'])
            ->where('status', 'approved');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        return response()->json([
            'items' => $query
                ->latest()
                ->get()
                ->map(fn (Item $item) => $this->transformItem($item)),
        ]);
    }

    public function myItems(Request $request): JsonResponse
    {
        return response()->json([
            'items' => Item::query()
                ->with(['user:id,name,email', 'category:id,name', 'approvedBy:id,name'])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (Item $item) => $this->transformItem($item)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:lost,found'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'location' => ['required', 'string', 'max:255'],
            'item_date' => ['required', 'date'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $imagePath = $request->file('image')?->store('item-images', 'public');

        $item = Item::create([
            'user_id' => $request->user()->id,
            'category_id' => $validated['category_id'] ?? null,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'location' => $validated['location'],
            'item_date' => $validated['item_date'],
            'image' => $imagePath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => ucfirst($validated['type']).' item submitted successfully and is awaiting admin review.',
            'item' => $this->transformItem($item->fresh(['user:id,name,email', 'category:id,name', 'approvedBy:id,name'])),
        ], 201);
    }

    protected function transformItem(Item $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'type' => $item->type,
            'status' => $item->status,
            'description' => $item->description,
            'location' => $item->location,
            'item_date' => optional($item->item_date)?->format('Y-m-d'),
            'admin_note' => $item->admin_note,
            'created_at' => optional($item->created_at)?->toISOString(),
            'image_url' => $item->image
                ? asset('storage/'.$item->image)
                : null,
            'user' => $item->user ? [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'email' => $item->user->email,
            ] : null,
            'category' => $item->category ? [
                'id' => $item->category->id,
                'name' => $item->category->name,
            ] : null,
            'approved_by' => $item->approvedBy ? [
                'id' => $item->approvedBy->id,
                'name' => $item->approvedBy->name,
            ] : null,
        ];
    }
}
