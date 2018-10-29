Feature: Find a barrier

	Scenario: Navigate to the find a barrier page
		Given I'm on the find a barrier page
		Then the title should be Market Access - Find a barrier
		And the active heading link should be Find a barrier
		And the page should not have any accessibility violations
