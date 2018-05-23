Feature: Market Access Homepage
	Everyone has to start somewhere

	Scenario: Default homepage
		Given I'm on the homepage
		Then the title should be Market Access - Homepage
		Then the page should not have any accessibility violations
		Then there should be a link to report a barrier
		Then the active heading link should be Dashboard
		Then the main heading should be Market access barriers Dashboard
		Then the footer links should be present

	Scenario: Navigate to Report a barrier
		Given I'm on the homepage
		When I navigate to the report a barrier page
		Then the title should be Market Access - Report a barrier
