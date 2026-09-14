package com.tradflow.accounting.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

/**
 * Standard JSON body returned by all API endpoints.
 *
 * <p>For paginated data, {@code responseObj} contains the current page content
 * and {@code count} contains the total number of records.</p>
 */
@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResultJson<T> {

    private final int code;
    private final boolean success;
    private final String message;
    private final T responseObj;
    private final Long count;
    private final Instant timestamp;

    public static <T> ResultJson<T> ok(T data) {
        return ok("Success", data);
    }

    public static <T> ResultJson<T> ok(String message, T data) {
        return success(HttpStatus.OK, message, data);
    }

    public static <T> ResultJson<T> created(String message, T data) {
        return success(HttpStatus.CREATED, message, data);
    }

    public static <T> ResultJson<List<T>> page(Page<T> page) {
        return page("Success", page);
    }

    public static <T> ResultJson<List<T>> page(String message, Page<T> page) {
        List<T> content = page == null ? List.of() : page.getContent();
        long total = page == null ? 0L : page.getTotalElements();
        return new ResultJson<>(HttpStatus.OK.value(), true, message, content, total, Instant.now());
    }

    public static <T> ResultJson<T> error(HttpStatus status, String message) {
        return new ResultJson<>(status.value(), false, message, null, null, Instant.now());
    }

    public static <T> ResultJson<T> error(HttpStatus status, String message, T responseObj) {
        return new ResultJson<>(status.value(), false, message, responseObj, null, Instant.now());
    }

    private static <T> ResultJson<T> success(HttpStatus status, String message, T data) {
        return new ResultJson<>(status.value(), true, message, data, null, Instant.now());
    }
}
