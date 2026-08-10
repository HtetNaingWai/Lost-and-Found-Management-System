<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConversationDeletion extends Model
{
    protected $fillable = [
        'user_id',
        'participant_id',
        'community_post_id',
        'item_id',
        'deleted_before',
    ];

    protected function casts(): array
    {
        return [
            'deleted_before' => 'datetime',
        ];
    }
}
