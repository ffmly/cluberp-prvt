import { expect, test } from "@playwright/test";

test.setTimeout(90_000);

test("platform manager creates a university through the protected workflow", async ({
  page,
}) => {
  const uniqueSuffix = Date.now().toString();
  const universityName = `E2E University ${uniqueSuffix}`;
  const universitySlug = `e2e-university-${uniqueSuffix}`;

  await page.goto("/en/login");
  await page.getByLabel("University email").fill("platform-admin@example.test");
  await page.getByLabel("Password").fill("PlatformTest!2026");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(
    page.getByText("Platform administration is available"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open administration" }).click();

  await expect(page).toHaveURL(/\/en\/admin$/);
  await expect(
    page.getByRole("heading", { name: "A clear view of every university." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Manage universities" }).click();

  const createSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Create a university" }),
  });
  await createSection.getByLabel("University name").fill(universityName);
  await createSection.getByLabel("URL slug").fill(universitySlug);
  await createSection.getByLabel("Operating status").selectOption("active");
  await createSection.getByRole("button", { name: "Create university" }).click();

  await expect(page.getByText("University created successfully.")).toBeVisible();
  await expect(page.getByRole("heading", { name: universityName })).toBeVisible();
  await expect(page.getByText(universitySlug)).toBeVisible();

  const universityCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: universityName }),
  });
  await universityCard
    .getByRole("link", { name: "Manage organization" })
    .click();

  await expect(page).toHaveURL(/\/en\/admin\/universities\/[0-9a-f-]+$/);
  await expect(page.getByRole("heading", { name: universityName })).toBeVisible();

  const campusName = `E2E Main Campus ${uniqueSuffix}`;
  const campusCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New campus" }),
  });
  await campusCard.getByLabel("Unit name").fill(campusName);
  await campusCard.getByLabel("Unit code").fill("MAIN");
  await campusCard.getByLabel("Campus address").fill("Algiers");
  await campusCard.getByRole("button", { name: "Create campus" }).click();
  await expect(
    page.getByText("Organizational unit created successfully."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: campusName })).toBeVisible();

  const facultyName = `E2E Faculty ${uniqueSuffix}`;
  const facultyCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New faculty" }),
  });
  await facultyCard.getByLabel("Unit name").fill(facultyName);
  await facultyCard.getByLabel("Unit code").fill("SCI");
  await facultyCard.getByLabel("Campus").selectOption({ label: campusName });
  await facultyCard.getByRole("button", { name: "Create faculty" }).click();
  await expect(page.getByRole("heading", { name: facultyName })).toBeVisible();

  const departmentName = `E2E Department ${uniqueSuffix}`;
  const departmentCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "New department" }),
  });
  await departmentCard.getByLabel("Unit name").fill(departmentName);
  await departmentCard.getByLabel("Unit code").fill("CS");
  await departmentCard
    .getByLabel("Faculty")
    .selectOption({ label: facultyName });
  await departmentCard
    .getByRole("button", { name: "Create department" })
    .click();
  await expect(page.getByRole("heading", { name: departmentName })).toBeVisible();

  await page.getByRole("link", { name: "Manage university staff" }).click();
  await expect(page).toHaveURL(
    /\/en\/admin\/universities\/[0-9a-f-]+\/staff$/,
  );
  await expect(
    page.getByRole("heading", { name: universityName }),
  ).toBeVisible();

  const createAssignmentSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Create a staff assignment" }),
  });
  await createAssignmentSection
    .getByLabel("Registered user email")
    .fill("staff-candidate@example.test");
  await createAssignmentSection
    .getByLabel("Assignment scope")
    .selectOption("department");
  await createAssignmentSection
    .getByLabel("Department")
    .selectOption({ label: departmentName });
  await createAssignmentSection
    .getByLabel("Staff function")
    .selectOption("supervisor");
  await createAssignmentSection
    .getByLabel("Position title")
    .fill("Department Supervisor");
  await createAssignmentSection
    .getByRole("button", { name: "Create assignment" })
    .click();

  await expect(
    page.getByText("Staff assignment created successfully."),
  ).toBeVisible();
  const assignmentCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "E2E Staff Candidate" }),
  });
  await expect(assignmentCard.getByText("staff-candidate@example.test")).toBeVisible();
  await expect(assignmentCard.getByText(departmentName)).toBeVisible();
  await assignmentCard.getByText("Edit assignment").click();
  await assignmentCard.getByLabel("Assignment status").selectOption("suspended");
  await assignmentCard.getByRole("button", { name: "Save assignment" }).click();
  await expect(
    page.getByText("Staff assignment updated successfully."),
  ).toBeVisible();
  await expect(
    assignmentCard.locator("span").filter({ hasText: /^Suspended$/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Users" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/users$/);
  await page.getByLabel("Search users").fill("staff-candidate@example.test");
  await page.getByRole("button", { name: "Search" }).click();

  const userCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "E2E Staff Candidate" }),
  });
  await userCard.getByText("Suspend access").click();
  await userCard
    .getByLabel("Reason")
    .fill("E2E account access policy verification");
  await userCard.getByRole("button", { name: "Suspend user" }).click();
  await expect(page.getByText("User access suspended successfully.")).toBeVisible();
  await expect(
    userCard.locator("span").filter({ hasText: /^Suspended$/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Audit" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/audit$/);
  await expect(
    page.getByText("User access suspended", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Target: E2E Staff Candidate").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "Users" }).click();
  await page.getByLabel("Search users").fill("staff-candidate@example.test");
  await page.getByRole("button", { name: "Search" }).click();
  const suspendedUserCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "E2E Staff Candidate" }),
  });
  await suspendedUserCard.getByText("Reactivate access").click();
  await suspendedUserCard
    .getByLabel("Reason")
    .fill("E2E verification completed successfully");
  await suspendedUserCard
    .getByRole("button", { name: "Reactivate user" })
    .click();
  await expect(page.getByText("User access reactivated successfully.")).toBeVisible();
  await expect(
    suspendedUserCard.locator("span").filter({ hasText: /^Active$/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Roles" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/roles$/);
  const roleName = `E2E User Operator ${uniqueSuffix}`;
  const roleKey = `e2e_user_operator_${uniqueSuffix}`;
  const newRoleSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Create a custom role" }),
  });
  await newRoleSection.getByLabel("Role key").fill(roleKey);
  await newRoleSection.getByLabel("Role name").fill(roleName);
  await newRoleSection
    .getByLabel("Description")
    .fill("E2E role lifecycle verification");
  await newRoleSection.getByLabel("Manage platform users").check();
  await newRoleSection.getByRole("button", { name: "Save role" }).click();
  await expect(page.getByText("Role created successfully.")).toBeVisible();

  const assignmentSection = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Assign a custom role" }),
  });
  await assignmentSection.getByLabel("Role name").selectOption({ label: roleName });
  await assignmentSection
    .getByLabel("User")
    .selectOption({ label: "E2E Staff Candidate — staff-candidate@example.test" });
  await assignmentSection.getByRole("button", { name: "Assign role" }).click();
  await expect(page.getByText("Role assigned successfully.")).toBeVisible();

  const roleAssignmentCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "E2E Staff Candidate" }),
    hasText: roleName,
  });
  await expect(roleAssignmentCard.getByText(roleName)).toBeVisible();
  await roleAssignmentCard
    .locator("summary")
    .filter({ hasText: /^Revoke assignment$/ })
    .click();
  await roleAssignmentCard.getByLabel("Reason").fill("E2E role lifecycle completed");
  await roleAssignmentCard
    .getByRole("button", { name: "Revoke assignment" })
    .click();
  await expect(roleAssignmentCard).toHaveCount(0);

  const roleCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: roleName }),
  });
  await roleCard
    .locator("summary")
    .filter({ hasText: /^Archive role$/ })
    .click();
  await roleCard.getByLabel("Reason").fill("E2E role retired after verification");
  await roleCard.getByRole("button", { name: "Archive role" }).click();
  await expect(roleCard.getByText("Archived", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("University email").fill("staff-candidate@example.test");
  await page.getByLabel("Password").fill("StaffTest!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await page
    .getByRole("link", { name: "Club registration and renewals" })
    .click();
  await expect(page).toHaveURL(/\/en\/dashboard\/club-requests$/);
  await expect(
    page.getByRole("heading", { name: "Register or renew a university club." }),
  ).toBeVisible();

  const clubName = `E2E Robotics Club ${uniqueSuffix}`;
  const clubSlug = `e2e-robotics-club-${uniqueSuffix}`;
  const clubRequestSection = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Submit a request" }),
  });
  await clubRequestSection
    .getByLabel("University")
    .selectOption({ label: universityName });
  await clubRequestSection.getByLabel("Club name").fill(clubName);
  await clubRequestSection.getByLabel("Club URL slug").fill(clubSlug);
  await clubRequestSection
    .getByLabel("Club purpose and activities")
    .fill("Hands-on robotics education and collaborative projects.");
  await clubRequestSection.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText("Club request submitted successfully.")).toBeVisible();
  await expect(page.getByRole("heading", { name: clubName })).toBeVisible();

  await page.getByRole("link", { name: "Back to workspace" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("University email").fill("platform-admin@example.test");
  await page.getByLabel("Password").fill("PlatformTest!2026");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Open administration" }).click();
  await page.getByRole("link", { name: "Club requests" }).click();

  const clubRequestCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: clubName }),
  });
  await clubRequestCard.getByRole("button", { name: "Start review" }).click();
  await expect(
    clubRequestCard.locator("span").filter({ hasText: /^Under review$/ }),
  ).toBeVisible();
  await clubRequestCard
    .getByLabel("Decision reason")
    .fill("University governance requirements verified.");
  await clubRequestCard
    .getByRole("button", { name: "Approve request" })
    .click();
  await expect(
    clubRequestCard.locator("span").filter({ hasText: /^Approved$/ }),
  ).toBeVisible();
});
