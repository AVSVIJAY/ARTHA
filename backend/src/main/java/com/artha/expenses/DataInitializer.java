package com.artha.expenses;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedExpenses(ExpenseService service) {
        return args -> {
            service.seed("Apartment rent", new BigDecimal("1450.00"), "Home", LocalDate.now().withDayOfMonth(1), "September rent");
            service.seed("Weekly groceries", new BigDecimal("86.40"), "Food", LocalDate.now().minusDays(2), "Market and pantry staples");
            service.seed("Metro pass", new BigDecimal("32.00"), "Transport", LocalDate.now().minusDays(5), null);
        };
    }
}
