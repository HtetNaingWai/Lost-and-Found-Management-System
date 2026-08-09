<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\UserNotification;
use App\Services\NotificationService;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClaimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $claims = Claim::query()
            ->with([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Claim $claim) => $this->transformClaim($claim));

        return response()->json([
            'claims' => $claims,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'community_post_id' => ['required', 'exists:community_posts,id'],
            'proof_description' => ['required', 'string'],
            'contact_phone' => ['required', 'string', 'max:50'],
        ]);

        /** @var CommunityPost $post */
        $post = CommunityPost::query()
            ->with(['user:id,name,email,profile_image', 'category:id,name'])
            ->findOrFail($validated['community_post_id']);

        if ($post->post_type !== 'found' || $post->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved found item posts can be claimed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($post->user_id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot claim your own found item post.',
            ], Response::HTTP_FORBIDDEN);
        }

        $existingClaim = Claim::query()
            ->where('community_post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existingClaim) {
            return response()->json([
                'message' => 'You already submitted a claim for this item.',
                'claim' => $this->transformClaim($existingClaim->load([
                    'user:id,name,email,profile_image',
                    'communityPost.user:id,name,email,profile_image',
                    'communityPost.category:id,name',
                    'reviewedBy:id,name',
                ])),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $claim = Claim::create([
            'community_post_id' => $post->id,
            'user_id' => $request->user()->id,
            'proof_description' => $validated['proof_description'],
            'contact_phone' => $validated['contact_phone'],
            'status' => 'pending',
        ]);

        $claimantNotification = NotificationService::create(
            $request->user()->id,
            'claim_submitted',
            'Claim submitted',
            ($post->title ?: 'Found item claim').' is awaiting admin review.',
            [
                'claim_id' => $claim->id,
                'community_post_id' => $post->id,
            ],
        );

        if ($post->user_id !== $request->user()->id) {
            NotificationService::create(
                $post->user_id,
                'claim_received',
                'New claim on your found item',
                ($request->user()->name ?: 'A user').' submitted a claim for '.($post->title ?: 'your found item').'.',
                [
                    'claim_id' => $claim->id,
                    'community_post_id' => $post->id,
                    'claimant_id' => $request->user()->id,
                ],
            );
        }

        WebhookDispatcher::dispatch('claim_created', [
            'claim' => $this->transformClaim($claim->load([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])),
        ]);

        return response()->json([
            'message' => 'Claim submitted successfully and is awaiting admin review.',
            'claim' => $this->transformClaim($claim->load([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])),
            'activity' => [
                'id' => 'claim-'.$claim->id,
                'title' => 'Claim submitted',
                'detail' => ($post->title ?: 'Found item claim').' is now pending admin review.',
                'time' => optional($claim->created_at)?->toISOString(),
                'icon' => 'clipboard',
            ],
            'notification' => $this->transformNotification($claimantNotification),
        ], Response::HTTP_CREATED);
    }

    protected function transformClaim(Claim $claim): array
    {
        return [
            'id' => $claim->id,
            'status' => $claim->status,
            'proof_description' => $claim->proof_description,
            'contact_phone' => $claim->contact_phone,
            'admin_note' => $claim->admin_note,
            'reviewed_at' => optional($claim->reviewed_at)?->toISOString(),
            'returned_at' => optional($claim->returned_at)?->toISOString(),
            'created_at' => optional($claim->created_at)?->toISOString(),
            'user' => $claim->user ? [
                'id' => $claim->user->id,
                'name' => $claim->user->name,
                'email' => $claim->user->email,
                'profile_image_url' => $claim->user->profile_image
                    ? asset('storage/'.$claim->user->profile_image)
                    : null,
            ] : null,
            'community_post' => $claim->communityPost ? [
                'id' => $claim->communityPost->id,
                'title' => $claim->communityPost->title,
                'post_type' => $claim->communityPost->post_type,
                'status' => $claim->communityPost->status,
                'content' => $claim->communityPost->content,
                'location' => $claim->communityPost->location,
                'item_date' => optional($claim->communityPost->item_date)?->format('Y-m-d'),
                'returned_at' => optional($claim->communityPost->returned_at)?->toISOString(),
                'image_url' => $claim->communityPost->image
                    ? asset('storage/'.$claim->communityPost->image)
                    : null,
                'category' => $claim->communityPost->category ? [
                    'id' => $claim->communityPost->category->id,
                    'name' => $claim->communityPost->category->name,
                ] : null,
                'user' => $claim->communityPost->user ? [
                    'id' => $claim->communityPost->user->id,
                    'name' => $claim->communityPost->user->name,
                    'email' => $claim->communityPost->user->email,
                    'profile_image_url' => $claim->communityPost->user->profile_image
                        ? asset('storage/'.$claim->communityPost->user->profile_image)
                        : null,
                ] : null,
            ] : null,
            'reviewed_by' => $claim->reviewedBy ? [
                'id' => $claim->reviewedBy->id,
                'name' => $claim->reviewedBy->name,
            ] : null,
        ];
    }

    protected function transformNotification(UserNotification $notification): array
    {
        return NotificationService::transform($notification);
    }
}
