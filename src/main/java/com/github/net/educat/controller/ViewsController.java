package com.github.net.educat.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewsController {


    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @GetMapping("/register")
    public String register() {
        return "register";
    }

    @GetMapping("/enrollment")
    public String enrollment() {
        return "enrollment";
    }

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/recover-password")
    public String recoverPasswpord() {
        return "recover-password";
    }

    @GetMapping("/student-dashboard")
    public String studentDashboard() {
        return "student-dashboard";
    }

    @GetMapping("/teacher-dashboard")
    public String teacherDashboard() {
        return "teacher-dashboard";
    }

    @GetMapping("/schedules")
    public String schedules() {
        return "schedule";
    }
    @GetMapping("/admin-dashboard")
    public String adminDashboard() {
        return "admin-dashboard";
    }
}
