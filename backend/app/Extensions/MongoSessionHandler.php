<?php

namespace App\Extensions;

use Illuminate\Contracts\Container\Container;
use Illuminate\Session\DatabaseSessionHandler;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class MongoSessionHandler extends DatabaseSessionHandler
{
    /**
     * {@inheritdoc}
     */
    protected function performInsert($sessionId, $payload)
    {
        try {
            return $this->getQuery()->insert([
                '_id' => $sessionId,  // Use _id instead of id for MongoDB
                'payload' => $payload,
                'last_activity' => $this->currentTime(),
                'user_id' => $this->userId(),
                'ip_address' => $this->ipAddress(),
                'user_agent' => $this->userAgent(),
            ]);
        } catch (\Exception $e) {
            // Handle duplicate key error
            if (str_contains($e->getMessage(), 'E11000')) {
                $this->performUpdate($sessionId, $payload);
                return true;
            }
            throw $e;
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function performUpdate($sessionId, $payload)
    {
        return $this->getQuery()->where('_id', $sessionId)->update([
            'payload' => $payload,
            'last_activity' => $this->currentTime(),
            'user_id' => $this->userId(),
            'ip_address' => $this->ipAddress(),
            'user_agent' => $this->userAgent(),
        ]);
    }

    /**
     * {@inheritdoc}
     */
    protected function getQuery()
    {
        return $this->connection->table($this->table);
    }

    /**
     * Get the current time.
     *
     * @return int
     */
    protected function currentTime()
    {
        return Carbon::now()->getTimestamp();
    }

    /**
     * Get the user ID.
     *
     * @return mixed
     */
    protected function userId()
    {
        if ($user = $this->container->make('auth')->user()) {
            return $user->getAuthIdentifier();
        }
    }

    /**
     * Get the IP address.
     *
     * @return string|null
     */
    protected function ipAddress()
    {
        if ($this->container->bound('request')) {
            return $this->container->make('request')->ip();
        }
    }

    /**
     * Get the user agent.
     *
     * @return string|null
     */
    protected function userAgent()
    {
        if ($this->container->bound('request')) {
            return substr((string) $this->container->make('request')->header('User-Agent'), 0, 500);
        }
    }
}