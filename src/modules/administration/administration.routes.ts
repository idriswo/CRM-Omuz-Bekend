import { Router } from "express";
import { logAction } from "../../middlewares/log.middleware";
import { getUsers, createUser, updateUser, deleteUser } from "./users.controller";
import { getRoles, createRole, updateRole, deleteRole } from "./roles.controller";
import { getPermissions, createPermission, updatePermission, deletePermission } from "./permissions.controller";
import { getLogs } from "./logs.controller";

const router = Router();

router.get("/users", getUsers);
router.post("/users", logAction("User", "create"), createUser);
router.put("/users/:id", logAction("User", "update"), updateUser);
router.delete("/users/:id", logAction("User", "delete"), deleteUser);

router.get("/roles", getRoles);
router.post("/roles", logAction("Role", "create"), createRole);
router.put("/roles/:id", logAction("Role", "update"), updateRole);
router.delete("/roles/:id", logAction("Role", "delete"), deleteRole);

router.get("/permissions", getPermissions);
router.post("/permissions", logAction("Permission", "create"), createPermission);
router.put("/permissions/:id", logAction("Permission", "update"), updatePermission);
router.delete("/permissions/:id", logAction("Permission", "delete"), deletePermission);

router.get("/logs", getLogs);

export default router;
