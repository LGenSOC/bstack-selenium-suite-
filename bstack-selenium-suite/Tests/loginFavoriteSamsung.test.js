// We bring in Selenium's core tools:
// 'Builder' to create our web browser
// 'By' to find things on the page (like ID, text, etc.)
// 'until' to wait for specific conditions (this is super important for stable tests!)
const { Builder, By, until } = require("selenium-webdriver");

// We get our browser setup details from a separate file.
// This keeps our test code clean and flexible for different browsers.
const { capabilities } = require("../browserstack.config");

// This describes a set of tests. Think of it as a folder for related tasks.
describe("Bstackdemo Shopping Journey: Login, Favorite, and Verify", () => {
  // 'driver' will be our robot that controls the web browser.
  let driver;

  // This code runs BEFORE EACH test in this group.
  // It's like setting up your workstation before starting a task.
  beforeEach(async () => {
    // --- Security Check: Make sure we have our login details! ---
    // It's important to never hardcode usernames or passwords directly in code.
    // We get them from environment variables (like from Jenkins).
    if (
      !process.env.BROWSERSTACK_USERNAME ||
      !process.env.BROWSERSTACK_ACCESS_KEY
    ) {
      throw new Error(
        "BrowserStack login details are missing! Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY."
      );
    }

    // --- Browser Setup: Tell Selenium which browser to use on BrowserStack ---
    // We take the first browser setup from our config file.
    const browserConfig = {
      ...capabilities[0],
      // We explicitly tell BrowserStack who we are using these details.
      "browserstack.user": process.env.BROWSERSTACK_USERNAME,
      "browserstack.key": process.env.BROWSERSTACK_ACCESS_KEY,
    };

    // Now, we create our web browser robot (the 'driver').
    // It connects to BrowserStack using our credentials.
    driver = await new Builder()
      .usingServer(
        `https://${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`
      )
      .withCapabilities(browserConfig)
      .build();

    // --- Go to the Website: Start our test on the sign-in page ---
    await driver.get("https://www.bstackdemo.com/signin");
    console.log(`Mapsd to: ${await driver.getCurrentUrl()}`);

    // --- Initial Page Load Wait: Ensure the page is ready before we interact ---
    // This is a robust wait to make sure the main part of the website (the '__next' container)
    // is fully loaded and visible. This prevents us from trying to click things too early.
    try {
      await driver.wait(
        until.elementLocated(By.id("__next")),
        20000, // Wait up to 20 seconds
        "Main page content container '__next' not found after loading."
      );
      await driver.wait(
        until.elementIsVisible(await driver.findElement(By.id("__next"))),
        10000, // Wait up to 10 seconds for it to be visible
        "Main page content container '__next' found but not visible."
      );
      console.log("Website content loaded and ready.");
    } catch (error) {
      console.error(`Error during initial page load: ${error.message}`);
      // Log more details if the page doesn't load to help debug
      console.log(`Current URL: ${await driver.getCurrentUrl()}`);
      console.log(
        `Page source (first 500 chars): ${await driver.getPageSource().substring(0, 500)}`
      );
      throw error; // If the page isn't ready, the test can't continue.
    }

    // A small, fixed pause as a buffer. Use sparingly.
    await driver.sleep(1500);
  }, 60000); // Max time for setup (60 seconds)

  // This code runs AFTER EACH test.
  // It's important to close the browser cleanly to free up resources.
  afterEach(async () => {
    if (driver) {
      await driver.quit(); // Close the browser
    }
  }, 60000); // Max time for cleanup (60 seconds)

  // --- Our Main Test Scenario ---
  // This describes one specific journey we want to test.
  test("User can log in, favorite a Samsung phone, and find it in favorites", async () => {
    // --- Step 1: Log in to the website ---
    console.log("Starting login process...");

    // Function to click a dropdown and select an option
    // This simplifies repetitive dropdown interactions.
    const selectDropdownOption = async (dropdownId, optionText) => {
      // Find and click the main dropdown (e.g., username or password field)
      const dropdownWrapper = await driver.wait(
        until.elementLocated(By.id(dropdownId)),
        15000,
        `Dropdown with ID '${dropdownId}' not found.`
      );
      await dropdownWrapper.click();
      console.log(`Clicked dropdown: ${dropdownId}`);

      // Wait for the specific option to appear and then click it
      const optionElement = await driver.wait(
        until.elementLocated(
          By.xpath(
            `//div[contains(@id, 'react-select') and text()='${optionText}']`
          )
        ),
        10000,
        `Option '${optionText}' not found in dropdown.`
      );
      await driver.wait(
        until.elementIsVisible(optionElement),
        5000,
        `Option '${optionText}' found but not visible.`
      );
      await optionElement.click();
      console.log(`Selected option: ${optionText}`);
      await driver.sleep(1500); // Small pause for UI to update after selection
    };

    // Select 'demouser' for username
    await selectDropdownOption("username", "demouser");

    // Select 'testingisfun99' for password
    await selectDropdownOption("password", "testingisfun99");

    // --- Click the Login button ---
    const loginButton = await driver.wait(
      until.elementLocated(By.id("login-btn")),
      10000,
      "Login button not found."
    );
    await driver.wait(
      until.elementIsVisible(loginButton),
      5000,
      "Login button not visible."
    );
    await driver.wait(
      until.elementIsEnabled(loginButton),
      5000,
      "Login button not enabled."
    );
    await loginButton.click();
    console.log("Clicked login button.");

    // Wait for the login to complete and the dashboard to load.
    // We're looking for the 'demouser' text, which confirms successful login.
    try {
      const usernameOnDashboard = await driver.wait(
        until.elementLocated(By.xpath("//span[contains(text(), 'demouser')]")),
        30000, // Give it plenty of time (30 seconds) to log in
        "User ('demouser') text not found on dashboard after login. Login likely failed."
      );
      expect(await usernameOnDashboard.getText()).toContain("demouser");
      console.log("Login successful! User 'demouser' is displayed.");
    } catch (error) {
      // If the user text isn't found, try to find an error message.
      try {
        const errorMessage = await driver.findElement(
          By.css('.api-error, .error-message, [role="alert"]')
        );
        const errorText = await errorMessage.getText();
        if (errorText.length > 0) {
          throw new Error(`Login failed with error: "${errorText}"`);
        }
      } catch (e) {
        // If no specific error message element is found, it's still a login failure.
        throw new Error(
          `Login failed and no clear error message found. Original issue: ${error.message}`
        );
      }
    }
    // Small pause after login confirmation
    await driver.sleep(2000);

    // --- Step 2: Filter products to show only "Samsung" devices ---
    console.log("Applying 'Samsung' filter...");
    const samsungFilterCheckbox = await driver.wait(
      until.elementLocated(
        By.xpath("//label[./input[@value='Samsung']]/span[@class='checkmark']")
      ),
      10000,
      "'Samsung' filter checkbox not found."
    );
    await samsungFilterCheckbox.click();
    console.log("Clicked 'Samsung' filter.");

    // Wait for the page to finish filtering (spinner disappears).
    // This is important because products change after filtering.
    await driver.wait(
      until.stalenessOf(driver.findElement(By.css(".spinner"))),
      10000,
      "Product loading spinner did not disappear after filtering."
    );
    console.log("Products filtered. Waiting for 'Galaxy S20+' to appear...");

    // --- Step 3: Find and Favorite the "Galaxy S20+" phone ---
    // We wait for the specific "Galaxy S20+" product name to appear after filtering.
    const galaxyS20PlusProductName = await driver.wait(
      until.elementLocated(By.xpath("//p[text()='Galaxy S20+']")),
      15000, // Give it enough time to show up
      "Galaxy S20+ product name not found after Samsung filter. Filter might not have worked or item is missing."
    );
    console.log("Found 'Galaxy S20+' product.");

    // Now, find the heart icon (favorite button) associated with this specific product.
    const favoriteButton = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[contains(@class, 'shelf-item') and .//p[text()='Galaxy S20+']]//button[contains(@class, 'MuiIconButton-root') and .//*[local-name()='svg']]"
        )
      ),
      10000,
      "Favorite heart button not found for Galaxy S20+."
    );
    await favoriteButton.click();
    console.log("Clicked to favorite 'Galaxy S20+'.");

    // Wait for the favorite button to visually confirm it's been clicked.
    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[contains(@class, 'shelf-item') and .//p[text()='Galaxy S20+']]//button[contains(@class, 'clicked')]"
        )
      ),
      10000,
      "Favorite button did not show 'clicked' state for Galaxy S20+."
    );
    console.log("Favorite action confirmed visually.");
    await driver.sleep(1000); // Small pause for good measure

    // --- Step 4: Go to the Favorites page and verify ---
    console.log("Navigating to the 'Favourites' page...");
    const favouritesLink = await driver.wait(
      until.elementLocated(By.id("favourites")),
      15000,
      "Favourites link not found in the navigation bar."
    );
    await favouritesLink.click();
    console.log("Clicked 'Favourites' link.");

    // On the favorites page, we expect to see 'Galaxy S20+'.
    const favoritedItemOnPage = await driver.wait(
      until.elementLocated(By.xpath("//p[text()='Galaxy S20+']")),
      20000, // Generous wait for favorites page to load
      "Galaxy S20+ not found on Favorites page."
    );
    // We confirm its text contains what we expect.
    expect(await favoritedItemOnPage.getText()).toContain("Galaxy S20+");
    console.log("Successfully found 'Galaxy S20+' on the Favorites page.");

    // Also, let's verify it's the ONLY item there (since we only favorited one).
    const allItemsOnFavoritesPage = await driver.findElements(
      By.css(".shelf-item")
    );
    expect(allItemsOnFavoritesPage.length).toBe(1);
    console.log("Confirmed: 'Galaxy S20+' is the only item in favorites.");

    console.log("--- Test finished successfully! 🎉 ---");
  }, 120000); // Overall test timeout (2 minutes) to cover all waits.
});
