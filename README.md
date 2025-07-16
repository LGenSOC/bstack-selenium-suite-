Write a small Selenium test suite that meets the following criteria:
Can be written in any language or framework
Executes on BrowserStack (you will need to create a free trial)
The suite must contain a test doing the following:
Log into www.bstackdemo.com using these dummy credentials: demouser/testingisfun99
Filter the product view to show "Samsung" devices only
Favorite the "Galaxy S20+" device by clicking the yellow heart icon
Verify that the Galaxy S20+ is listed on the Favorites page
Run across the following three browsers in parallel:
Windows 10 Chrome
macOS Ventura Firefox
Samsung Galaxy S22
Note: Sensitive data should not be hardcoded and can be referenced as a variable
Execute the test suite from a Jenkins server
When complete, please share the suite as a Github repo and provide evidence of your Jenkins job -- either the pipeline code or screenshots of the build configuration.