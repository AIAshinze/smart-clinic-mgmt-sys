package com.project.back_end.mvc;

import com.project.back_end.services.Service;
import org.springframework.ui.Model;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class DashboardController {
    private final Service service;

    public DashboardController(Service service) {
        this.service = service;
    }

    @GetMapping("/adminDashboard/{token}")
    public String adminDashboard(@PathVariable String token, Model model) {
        if (!service.validateToken(token, "admin")) {
            return "redirect:/";
        }
        model.addAttribute("authToken", token);
        model.addAttribute("role", "admin");
        return "admin/adminDashboard";
    }

    @GetMapping("/doctorDashboard/{token}")
    public String doctorDashboard(@PathVariable String token, Model model) {
        if (!service.validateToken(token, "doctor")) {
            return "redirect:/";
        }
        model.addAttribute("authToken", token);
        model.addAttribute("role", "doctor");
        return "doctor/doctorDashboard";
    }
}
