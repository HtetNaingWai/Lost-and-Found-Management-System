<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedPost extends Model
{
    protected $fillable = [
        'user_id',
        'community_post_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function communityPost(): BelongsTo
    {
        return $this->belongsTo(CommunityPost::class);
    }
}
