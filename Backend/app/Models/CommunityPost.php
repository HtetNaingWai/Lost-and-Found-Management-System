<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityPost extends Model
{
    protected $fillable = [
        'user_id',
        'post_type',
        'title',
        'content',
        'category_id',
        'location',
        'item_date',
        'image',
        'status',
        'admin_note',
        'approved_by',
        'approved_at',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'item_date' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
