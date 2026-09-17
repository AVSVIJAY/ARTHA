package com.artha.expenses;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ExpenseService {
    private final ConcurrentMap<UUID, Expense> expenses = new ConcurrentHashMap<>();
    private volatile BigDecimal income = BigDecimal.ZERO;

    public List<Expense> findAll(String category) {
        return expenses.values().stream()
                .filter(expense -> category == null || category.isBlank() || expense.category().equalsIgnoreCase(category))
                .sorted(Comparator.comparing(Expense::date).reversed())
                .toList();
    }

    public Expense create(ExpenseRequest request) {
        Expense expense = new Expense(UUID.randomUUID(), request.description(), request.amount(), request.category(), request.date(), request.note());
        expenses.put(expense.id(), expense);
        return expense;
    }

    public void delete(UUID id) {
        expenses.remove(id);
    }

    public BigDecimal income() {
        return income;
    }

    public BigDecimal setIncome(IncomeRequest request) {
        income = request.amount();
        return income;
    }
}
