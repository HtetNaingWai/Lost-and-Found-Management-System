<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    protected $fillable = [
        'user_id',
        'post_type',
        'title',
        'content',
        'category_id',
        'location',
        'latitude',
        'longitude',
        'item_date',
        'image',
        'status',
        'admin_note',
        'approved_by',
        'approved_at',
        'rejected_at',
        'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'item_date' => 'date',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'returned_at' => 'datetime',
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

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function savedPosts(): HasMany
    {
        return $this->hasMany(SavedPost::class);
    }
}
