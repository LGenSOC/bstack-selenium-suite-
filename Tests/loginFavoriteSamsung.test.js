// I bring in Selenium's core tools:
// 'Builder' to create my web browser
// 'By' to find things on the page (like ID, text, etc.)
// 'until' to wait for specific conditions (this is super important for stable tests!)
const { Builder, By, until } = require("selenium-webdriver");

// I get my browser setup details from a separate file.
// This keeps my test code clean and flexible for different browsers.
const { capabilities } = require("../browserstack.config");

// Loop through each configuration in the 'capabilities' array.
// The 'config' variable will be one of the browsers from your config file on each iteration.
capabilities.forEach((config) => {
  // This describes a set of tests for a specific browser/device.
  // I use the browser and OS details to create a unique test title.
  describe(`Bstackdemo Journey on ${config.browserName || config.device || "Unknown"} - ${config.os || "Unknown OS"}`, () => {
    // 'driver' will be my robot that controls the web browser.
    let driver;

    // This code runs BEFORE EACH test in this group.
    beforeEach(async () => {
      // --- Security Check: Make sure I have my login details! ---
      if (
        !process.env.BROWSERSTACK_USERNAME ||
        !process.env.BROWSERSTACK_ACCESS_KEY
      ) {
        throw new Error(
          "BrowserStack login details are missing! Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY."
        );
      }

      // --- Browser Setup: I tell Selenium which browser to use on BrowserStack ---
      const browserConfig = {
        ...config, // Use the current configuration from the loop
        "browserstack.user": process.env.BROWSERSTACK_USERNAME,
        "browserstack.key": process.env.BROWSERSTACK_ACCESS_KEY,
      };

      // Now, I create my web browser robot (the 'driver').
      driver = await new Builder()
        .usingServer(
          `https://${process.env.BROWSERSTACK_USERNAME}:${process.env.BROWSERSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`
        )
        .withCapabilities(browserConfig)
        .build();

      // --- Go to the Website: I start my test on the sign-in page ---
      await driver.get("https://www.bstackdemo.com/signin");
      console.log(`Mapsd to: ${await driver.getCurrentUrl()}`);

      // --- Initial Page Load Wait: I ensure the page is ready before I interact ---
      try {
        await driver.wait(
          until.elementLocated(By.id("__next")),
          20000,
          "Main page content container '__next' not found after loading."
        );
        await driver.wait(
          until.elementIsVisible(await driver.findElement(By.id("__next"))),
          10000,
          "Main page content container '__next' found but not visible."
        );
        console.log("Website content loaded and ready.");
      } catch (error) {
        console.error(`Error during initial page load: ${error.message}`);
        console.log(`Current URL: ${await driver.getCurrentUrl()}`);
        console.log(
          `Page source (first 500 chars): ${await driver.getPageSource().substring(0, 500)}`
        );
        throw error;
      }
      await driver.sleep(1500);
    }, 60000);

    // This code runs AFTER EACH test.
    afterEach(async () => {
      if (driver) {
        await driver.quit(); // Close the browser
      }
    }, 60000);

    // --- My Main Test Scenario ---
    test("User can log in, favorite a Samsung phone, and find it in favorites", async () => {
      try {
        // --- BROWSERSTACK EXECUTOR: Set Session Name ---
        const sessionName = `Bstackdemo Test on ${config.browserName || config.device} - ${config.os || config.os_version}`;
        const sessionNameExecutor = {
          action: "setSessionName",
          arguments: { name: sessionName },
        };
        await driver.executeScript(
          "browserstack_executor: " + JSON.stringify(sessionNameExecutor),
          []
        );

        // --- Step 1: I log in to the website ---
        console.log("Starting login process...");
        const selectDropdownOption = async (dropdownId, optionText) => {
          const dropdownWrapper = await driver.wait(
            until.elementLocated(By.id(dropdownId)),
            15000,
            `Dropdown with ID '${dropdownId}' not found.`
          );
          await dropdownWrapper.click();
          console.log(`Clicked dropdown: ${dropdownId}`);
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
          await driver.sleep(1500);
        };
        await selectDropdownOption("username", "demouser");
        await selectDropdownOption("password", "testingisfun99");
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
        try {
          const usernameOnDashboard = await driver.wait(
            until.elementLocated(
              By.xpath("//span[contains(text(), 'demouser')]")
            ),
            30000,
            "User ('demouser') text not found on dashboard after login. Login likely failed."
          );
          expect(await usernameOnDashboard.getText()).toContain("demouser");
          console.log("Login successful! User 'demouser' is displayed.");
        } catch (error) {
          try {
            const errorMessage = await driver.findElement(
              By.css('.api-error, .error-message, [role="alert"]')
            );
            const errorText = await errorMessage.getText();
            if (errorText.length > 0) {
              throw new Error(`Login failed with error: "${errorText}"`);
            }
          } catch (e) {
            throw new Error(
              `Login failed and no clear error message found. Original issue: ${error.message}`
            );
          }
        }
        await driver.sleep(2000);

        // --- Step 2: I filter products to show only "Samsung" devices ---
        console.log("Applying 'Samsung' filter...");
        const samsungFilterCheckbox = await driver.wait(
          until.elementLocated(
            By.xpath(
              "//label[./input[@value='Samsung']]/span[@class='checkmark']"
            )
          ),
          10000,
          "'Samsung' filter checkbox not found."
        );
        await samsungFilterCheckbox.click();
        console.log("Clicked 'Samsung' filter.");
        await driver.wait(
          until.stalenessOf(driver.findElement(By.css(".spinner"))),
          10000,
          "Product loading spinner did not disappear after filtering."
        );
        console.log(
          "Products filtered. Waiting for 'Galaxy S20+' to appear..."
        );

        // --- Step 3: I find and Favorite the "Galaxy S20+" phone ---
        const galaxyS20PlusProductName = await driver.wait(
          until.elementLocated(By.xpath("//p[text()='Galaxy S20+']")),
          15000,
          "Galaxy S20+ product name not found after Samsung filter. Filter might not have worked or item is missing."
        );
        console.log("Found 'Galaxy S20+' product.");
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
        await driver.sleep(1000);

        // --- Step 4: I go to the Favorites page and verify ---
        console.log("Navigating to the 'Favourites' page...");
        const favouritesLink = await driver.wait(
          until.elementLocated(By.id("favourites")),
          15000,
          "Favourites link not found in the navigation bar."
        );
        await favouritesLink.click();
        console.log("Clicked 'Favourites' link.");

        // This wait correctly handles the StaleElementReferenceError by finding the element again on the new page.
        const favoritedItemOnPage = await driver.wait(
          until.elementLocated(By.xpath("//p[text()='Galaxy S20+']")),
          20000,
          "Galaxy S20+ not found on Favorites page."
        );
        expect(await favoritedItemOnPage.getText()).toContain("Galaxy S20+");
        console.log("Successfully found 'Galaxy S20+' on the Favorites page.");
        const allItemsOnFavoritesPage = await driver.findElements(
          By.css(".shelf-item")
        );
        expect(allItemsOnFavoritesPage.length).toBe(1);
        console.log("Confirmed: 'Galaxy S20+' is the only item in favorites.");

        // --- BROWSERSTACK EXECUTOR: Set Test Status to 'passed' ---
        const statusPassedExecutor = {
          action: "setSessionStatus",
          arguments: {
            status: "passed",
            reason: "User was able to log in, favorite an item, and verify it.",
          },
        };
        await driver.executeScript(
          "browserstack_executor: " + JSON.stringify(statusPassedExecutor),
          []
        );
        console.log("--- Test finished successfully! 🎉 ---");
      } catch (error) {
        // --- BROWSERSTACK EXECUTOR: Set Test Status to 'failed' ---
        console.error("Test failed:", error);
        const statusFailedExecutor = {
          action: "setSessionStatus",
          arguments: {
            status: "failed",
            reason: error.message,
          },
        };
        await driver.executeScript(
          "browserstack_executor: " + JSON.stringify(statusFailedExecutor),
          []
        );
        throw error;
      }
    }, 120000);
  });
});
