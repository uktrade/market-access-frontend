Feature: Report a barrier
	Start to report a new barrier

	Scenario: Navigate to Report a barrier
		Given I'm on the report a barrier page
		Then the title should be Market Access - Report a barrier
		Then the page should not have any accessibility violations
		Then the active heading link should be Report a barrier
		Then the main heading should be Market access barriers Report a barrier
