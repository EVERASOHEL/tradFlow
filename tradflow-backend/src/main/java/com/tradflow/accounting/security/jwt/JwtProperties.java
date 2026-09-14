package com.tradflow.accounting.security.jwt;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** Base64 or plain secret, minimum 256 bits recommended for HS256. */
    private String secret;

    private long accessTokenExpiryMs;

    private long refreshTokenExpiryMs;

    private String issuer;
}
