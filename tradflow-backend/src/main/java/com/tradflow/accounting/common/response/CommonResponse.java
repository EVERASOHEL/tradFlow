package com.tradflow.accounting.common.response;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;

/**
 * Common controller response factory.
 * Controllers should return this factory's result instead of constructing
 * {@link ResponseEntity} and {@link ResultJson} repeatedly.
 */
public final class CommonResponse {

    private static final String SUCCESS = "Success";

    private CommonResponse() {
    }

    public static <T> ResponseEntity<ResultJson<T>> getData(T data) {
        return getData(data, SUCCESS);
    }

    public static <T> ResponseEntity<ResultJson<T>> getData(T data, String message) {
        return ResponseEntity.ok(ResultJson.ok(message, data));
    }

    public static <T> ResponseEntity<ResultJson<List<T>>> getData(Page<T> page) {
        return getData(page, SUCCESS);
    }

    public static <T> ResponseEntity<ResultJson<List<T>>> getData(Page<T> page, String message) {
        return ResponseEntity.ok(ResultJson.page(message, page));
    }

    public static <T> ResponseEntity<ResultJson<T>> created(T data, String message) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ResultJson.created(message, data));
    }

    public static ResponseEntity<ResultJson<Void>> exception(String message) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResultJson.error(HttpStatus.BAD_REQUEST, message));
    }

    public static ResponseEntity<ResultJson<Void>> somethingWentWrong() {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResultJson.error(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong"));
    }
}
