Feature: Environment Hooks

  Background:
    Given a file named "features/a.feature" with:
      """
      Feature: some feature
        Scenario: some scenario
          Given a step
      """
    And a file named "features/step_definitions/cucumber_steps.js" with:
      """
      var cucumberSteps = function() {
        this.Given(/^a step$/, function() { });
      };
      module.exports = cucumberSteps;
      """

  Scenario: Hooks are steps
    Given a file named "features/support/hooks.js" with:
      """
      var hooks = function () {
        this.Before(function() {});
        this.After(function() {});
      };
      module.exports = hooks;
      """
    When I run cucumber.js
    Then the scenario "some scenario" has the steps
      | IDENTIFIER   |
      | Before       |
      | Given a step |
      | After        |

  Scenario: Failing before fails the scenario
    Given a file named "features/support/hooks.js" with:
      """
      var hooks = function () {
        this.Before(function() { throw 'Fail' });
      };
      module.exports = hooks;
      """
    When I run cucumber.js
    Then the exit status should be 1

  Scenario: Failing after hook fails the scenario
    Given a file named "features/support/hooks.js" with:
      """
      var hooks = function () {
        this.After(function() { throw 'Fail' });
      };
      module.exports = hooks;
      """
    When I run cucumber.js
    Then the exit status should be 1

  Scenario: After hooks still execute after a failure
    Given a file named "features/support/hooks.js" with:
      """
      var hooks = function () {
        this.Before(function() { throw 'Fail' });
        this.After(function() {});
      };
      module.exports = hooks;
      """
    When I run cucumber.js
    Then the "After" hook has status "passed"

  Scenario: World is this in hooks
    Given a file named "features/support/world.js" with:
      """
      var WorldConstructor = function WorldConstructor() {
        return {
          isWorld: function() { return true; }
        };
      };

      module.exports = function() {
        this.World = WorldConstructor;
      };
      """
    Given a file named "features/support/hooks.js" with:
      """
      var hooks = function () {
        this.Before(function() {
          if (!this.isWorld()) {
            throw Error("Expected this to be world");
          }
        });

        this.After(function() {
          if (!this.isWorld()) {
            throw Error("Expected this to be world");
          }
        });
      };

      module.exports = hooks;
      """
    When I run cucumber.js
    Then the exit status should be 0
