package com.artha.expenses;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record IncomeRequest(
        @NotNull @DecimalMin(value = "0.00") BigDecimal amount
) {}
