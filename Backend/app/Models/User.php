<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'nrc_no',
        'nrc_front_photo',
        'nrc_back_photo',
        'profile_image',
        'password',
        'role',
        'status',
        'is_online',
        'last_seen_at',
        'banned_at',
        'ban_reason',
        'show_phone_publicly',
        'show_email_publicly',
        'show_location_publicly',
        'public_location',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_online' => 'boolean',
            'last_seen_at' => 'datetime',
            'banned_at' => 'datetime',
            'show_phone_publicly' => 'boolean',
            'show_email_publicly' => 'boolean',
            'show_location_publicly' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function ratingsGiven(): HasMany
    {
        return $this->hasMany(UserRating::class, 'reviewer_id');
    }

    public function ratingsReceived(): HasMany
    {
        return $this->hasMany(UserRating::class, 'reviewed_user_id');
    }

    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function supportConversations(): HasMany
    {
        return $this->hasMany(SupportConversation::class);
    }

    public function communityPosts(): HasMany
    {
        return $this->hasMany(CommunityPost::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class, 'recipient_user_id');
    }

    public function savedPosts(): HasMany
    {
        return $this->hasMany(SavedPost::class);
    }

    public function markOnline(): void
    {
        $this->forceFill([
            'is_online' => true,
            'last_seen_at' => now(),
        ])->save();
    }

    public function markOffline(): void
    {
        $this->forceFill([
            'is_online' => false,
            'last_seen_at' => now(),
        ])->save();
    }

    public function presencePayload(): array
    {
        $isRecentlySeen = $this->last_seen_at !== null
            && $this->last_seen_at->greaterThanOrEqualTo(now()->subSeconds(75));
        $isOnline = (bool) $this->is_online && $isRecentlySeen;

        return [
            'is_online' => $isOnline,
            'isOnline' => $isOnline,
            'last_seen_at' => optional($this->last_seen_at)?->toISOString(),
            'lastSeen' => optional($this->last_seen_at)?->toISOString(),
        ];
    }
}
