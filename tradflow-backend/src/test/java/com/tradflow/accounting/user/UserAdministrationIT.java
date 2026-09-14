package com.tradflow.accounting.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tradflow.accounting.permission.entity.Permission;
import com.tradflow.accounting.permission.repository.PermissionRepository;
import com.tradflow.accounting.role.entity.Role;
import com.tradflow.accounting.role.entity.RolePermission;
import com.tradflow.accounting.role.repository.RolePermissionRepository;
import com.tradflow.accounting.role.repository.RoleRepository;
import com.tradflow.accounting.user.entity.User;
import com.tradflow.accounting.user.entity.UserRole;
import com.tradflow.accounting.user.repository.UserRepository;
import com.tradflow.accounting.user.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserAdministrationIT {

    private static final String ADMIN_PASSWORD = "Admin@12345";
    private static final String ACCOUNTANT_PASSWORD = "Count@12345";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private RolePermissionRepository rolePermissionRepository;
    @Autowired
    private PermissionRepository permissionRepository;

    private UUID adminRoleId;
    private UUID accountantRoleId;

    @BeforeEach
    void setUp() {
        userRoleRepository.deleteAll();
        rolePermissionRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();

        Permission userCreate = permission("USER_CREATE", "Create User", "USER");
        Permission userView = permission("USER_VIEW", "View User", "USER");
        Permission userUpdate = permission("USER_UPDATE", "Update User", "USER");

        Role adminRole = role("ADMIN", "Administrator");
        Role accountantRole = role("ACCOUNTANT", "Accountant");
        adminRoleId = adminRole.getId();
        accountantRoleId = accountantRole.getId();

        grant(adminRole, userCreate);
        grant(adminRole, userView);
        grant(adminRole, userUpdate);
        grant(accountantRole, userView);

        User admin = user("admin", "admin@tradeflow.test", ADMIN_PASSWORD, "System Administrator");
        userRoleRepository.save(UserRole.builder().user(admin).role(adminRole).active(true).build());

        User accountant = user("accountant", "accountant@tradeflow.test", ACCOUNTANT_PASSWORD, "Staff Accountant");
        userRoleRepository.save(UserRole.builder().user(accountant).role(accountantRole).active(true).build());
    }

    @Test
    void adminCanCreateUserWithRoleAndSeePermissionsOnList() throws Exception {
        String token = login("admin", ADMIN_PASSWORD);

        String body = """
                {
                  "username": "jane",
                  "email": "jane@tradeflow.test",
                  "password": "Jane@12345",
                  "fullName": "Jane Doe",
                  "phone": "555-0100",
                  "active": true,
                  "roleId": "%s"
                }
                """.formatted(accountantRoleId);

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.responseObj.username").value("jane"))
                .andExpect(jsonPath("$.responseObj.roles[0].code").value("ACCOUNTANT"))
                .andExpect(jsonPath("$.responseObj.permissions[0].code").value("USER_VIEW"));

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseObj[?(@.username=='jane')].roles[0].name").value("Accountant"))
                .andExpect(jsonPath("$.responseObj[?(@.username=='jane')].permissions[0].name").value("View User"));
    }

    @Test
    void createUserWithoutRoleIdFailsValidation() throws Exception {
        String token = login("admin", ADMIN_PASSWORD);
        String body = """
                {
                  "username": "nole",
                  "email": "nole@tradeflow.test",
                  "password": "Nole@12345",
                  "fullName": "No Role"
                }
                """;

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void adminCanViewUserDetailsReplaceRoleAndToggleStatus() throws Exception {
        String token = login("admin", ADMIN_PASSWORD);
        UUID userId = createUser(token, "viewme", accountantRoleId);

        mockMvc.perform(get("/api/users/" + userId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseObj.fullName").value("View Me"))
                .andExpect(jsonPath("$.responseObj.roles[0].code").value("ACCOUNTANT"))
                .andExpect(jsonPath("$.responseObj.permissions.length()").value(1));

        String update = """
                {
                  "email": "viewme@tradeflow.test",
                  "fullName": "View Me",
                  "phone": "555-0101",
                  "active": true,
                  "accountLocked": false,
                  "roleId": "%s"
                }
                """.formatted(adminRoleId);

        mockMvc.perform(put("/api/users/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(update))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseObj.roles[0].code").value("ADMIN"))
                .andExpect(jsonPath("$.responseObj.permissions.length()").value(3));

        mockMvc.perform(put("/api/users/" + userId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseObj.active").value(false));

        mockMvc.perform(put("/api/users/" + userId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.responseObj.active").value(true));
    }

    @Test
    void cannotDeactivateLastActiveAdministrator() throws Exception {
        String token = login("admin", ADMIN_PASSWORD);
        UUID adminId = userRepository.findByUsername("admin").orElseThrow().getId();

        mockMvc.perform(put("/api/users/" + adminId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot deactivate the last active administrator"));
    }

    @Test
    void accountantCannotManageUsers() throws Exception {
        String token = login("accountant", ACCOUNTANT_PASSWORD);
        UUID adminId = userRepository.findByUsername("admin").orElseThrow().getId();

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/users/" + adminId).header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "blocked",
                                  "email": "blocked@tradeflow.test",
                                  "password": "Blocked@123",
                                  "fullName": "Blocked User",
                                  "roleId": "%s"
                                }
                                """.formatted(accountantRoleId)))
                .andExpect(status().isForbidden());
    }

    private UUID createUser(String token, String username, UUID roleId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "%s",
                                  "email": "%s@tradeflow.test",
                                  "password": "User@12345",
                                  "fullName": "View Me",
                                  "active": true,
                                  "roleId": "%s"
                                }
                                """.formatted(username, username, roleId)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        return UUID.fromString(root.path("responseObj").path("id").asText());
    }

    private String login(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"%s"}
                                """.formatted(username, password)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        String token = root.path("responseObj").path("accessToken").asText();
        assertThat(token).isNotBlank();
        return token;
    }

    private Permission permission(String code, String name, String module) {
        return permissionRepository.save(Permission.builder()
                .code(code)
                .name(name)
                .module(module)
                .active(true)
                .build());
    }

    private Role role(String code, String name) {
        return roleRepository.save(Role.builder()
                .code(code)
                .name(name)
                .description(name)
                .active(true)
                .build());
    }

    private void grant(Role role, Permission permission) {
        rolePermissionRepository.save(RolePermission.builder()
                .role(role)
                .permission(permission)
                .build());
    }

    private User user(String username, String email, String rawPassword, String fullName) {
        return userRepository.save(User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .fullName(fullName)
                .active(true)
                .accountLocked(false)
                .failedLoginAttempts(0)
                .build());
    }
}
