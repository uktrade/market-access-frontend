Feature: Report a barrier
	Start to report a new barrier

	Scenario: Navigate to Report a barrier
		Given I'm on the report a barrier page
		Then the title should be Market Access - Report a barrier
		And the page should not have any accessibility violations
		And the active heading link should be Report a barrier
		And the main heading should be Market access barriers Report a barrier
		And there should be a start banner with a start button
		And a task list with 9 items

	Scenario: Navigate to start
		Given I'm on the report a barrier page
		When I navigate to the start page
		Then the title should be Market Access - Report - Status of the problem
		And the page should not have any accessibility violations
		And the main heading should be Report a barrier Status of the problem
		And there should be a Continue button

	Scenario: Start a report
		Given I'm on the start a report page
		Then it should hide the emergency question
		When I click the first status radio
		Then it should reveal the emergency question
		When I click the second status radio
		Then it should reveal the emergency question
		When I click the third status radio
		Then it should hide the emergency question
