package com.mailflow.auth.application;

import com.mailflow.auth.infrastructure.jwt.JwtProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
public class RefreshTokenGraceCacheConfig {

    @Bean
    @ConditionalOnBean(StringRedisTemplate.class)
    @ConditionalOnProperty(name = "mailflow.auth.refresh-grace-store", havingValue = "redis")
    public RefreshTokenGraceCache redisRefreshTokenGraceCache(StringRedisTemplate stringRedisTemplate, JwtProperties jwtProperties) {
        return new RedisRefreshTokenGraceCache(stringRedisTemplate, jwtProperties);
    }

    @Bean
    @ConditionalOnMissingBean(RefreshTokenGraceCache.class)
    public RefreshTokenGraceCache inMemoryRefreshTokenGraceCache(JwtProperties jwtProperties) {
        return new InMemoryRefreshTokenGraceCache(jwtProperties);
    }
}
