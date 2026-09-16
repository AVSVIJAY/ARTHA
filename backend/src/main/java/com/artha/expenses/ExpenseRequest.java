package com.artha.expenses;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotBlank @Size(max = 80) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotBlank String category,
        @NotNull LocalDate date,
        @Size(max = 280) String note
) {}
