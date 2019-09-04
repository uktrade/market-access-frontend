Feature: Report a barrier
	Start to add a new barrier

	Scenario: Navigate to Add a barrier
		Given I'm on the add a barrier page
		Then the title should be Market Access - Add a barrier
		And the page should not have any accessibility violations
		And the active heading link should be Add a barrier
		And the main heading should be Market access barriers Add a barrier
		And there should be a start banner with a start button
		And a task list with 5 items

	Scenario: Navigate to start
		Given I'm on the add a barrier page
		When I navigate to the start page
		Then the title should be Market Access - Add - Status of the barrier
		And the page should not have any accessibility violations
		And the main heading should be Add a barrier Barrier status

	Scenario: Start a report
		Given I'm on the first step of adding a new barrier
		Then there should 2 radio inputs
		And there should be a Continue button
