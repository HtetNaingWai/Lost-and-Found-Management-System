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
            ($post->title ?: 'Found item claim').' was sent to the finder for review.',
            [
                'claim_id' => $claim->id,
                'community_post_id' => $post->id,
            ],
        );

        if ($post->user_id !== $request->user()->id) {
            NotificationService::create(
                $post->user_id,
                'claim_received',
                'New claim received',
                ($request->user()->name ?: 'A user').' submitted a claim for your found item "'.($post->title ?: 'Found item').'".',
                [
                    'claim_id' => $claim->id,
                    'community_post_id' => $post->id,
                    'claimant_id' => $request->user()->id,
                    'section' => 'my-found',
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
            'message' => 'Claim submitted successfully. The finder has been notified.',
            'claim' => $this->transformClaim($claim->load([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])),
            'activity' => [
                'id' => 'claim-'.$claim->id,
                'title' => 'Claim submitted',
                'detail' => ($post->title ?: 'Found item claim').' is now pending finder review.',
                'time' => optional($claim->created_at)?->toISOString(),
                'icon' => 'clipboard',
            ],
            'notification' => $this->transformNotification($claimantNotification),
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, Claim $claim): JsonResponse
    {
        abort_unless($claim->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending claims can be edited.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'proof_description' => ['required', 'string'],
            'contact_phone' => ['required', 'string', 'max:50'],
        ]);

        $claim->update([
            'proof_description' => $validated['proof_description'],
            'contact_phone' => $validated['contact_phone'],
        ]);

        return response()->json([
            'message' => 'Claim updated successfully.',
            'claim' => $this->transformClaim($claim->fresh([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])),
        ]);
    }

    public function destroy(Request $request, Claim $claim): JsonResponse
    {
        abort_unless($claim->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending claims can be withdrawn.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $claim->delete();

        return response()->json([
            'message' => 'Claim withdrawn successfully.',
        ]);
    }

    public function markReturned(Request $request, Claim $claim): JsonResponse
    {
        $claim->load([
            'user:id,name,email,profile_image',
            'communityPost.user:id,name,email,profile_image',
            'communityPost.category:id,name',
            'reviewedBy:id,name',
        ]);

        if (!$claim->communityPost || $claim->communityPost->post_type !== 'found') {
            return response()->json([
                'message' => 'Only claims for found item posts can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        abort_unless($claim->communityPost->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if (!in_array($claim->status, ['pending', 'approved'], true)) {
            return response()->json([
                'message' => 'Only active claims can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $returnedAt = now();

        $claim->status = 'returned';
        $claim->returned_at = $returnedAt;
        $claim->save();

        $claim->communityPost->status = 'returned';
        $claim->communityPost->returned_at = $returnedAt;
        $claim->communityPost->save();

        NotificationService::create(
            $claim->user_id,
            'item_returned',
            'Item returned',
            ($claim->communityPost->title ?: 'Found item').' has been marked as returned.',
            [
                'claim_id' => $claim->id,
                'community_post_id' => $claim->community_post_id,
                'finder_id' => $request->user()->id,
                'section' => 'my-claims',
            ],
        );

        $finderNotification = NotificationService::create(
            $claim->communityPost->user_id,
            'return_completed',
            'Return completed',
            ($claim->communityPost->title ?: 'Found item').' has been recorded as successfully returned.',
            [
                'claim_id' => $claim->id,
                'community_post_id' => $claim->community_post_id,
                'claimant_id' => $claim->user_id,
                'section' => 'my-found',
            ],
        );

        $claimPayload = $this->transformClaim($claim->fresh([
            'user:id,name,email,profile_image',
            'communityPost.user:id,name,email,profile_image',
            'communityPost.category:id,name',
            'reviewedBy:id,name',
        ]));

        WebhookDispatcher::dispatch('item_returned', [
            'claim' => $claimPayload,
        ]);

        return response()->json([
            'message' => 'Item marked as returned successfully.',
            'claim' => $claimPayload,
            'notification' => $this->transformNotification($finderNotification),
        ]);
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
