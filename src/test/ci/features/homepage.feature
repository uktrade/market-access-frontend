Feature: Market Access Homepage
	Everyone has to start somewhere

	Scenario: Default homepage
		Given I'm on the homepage
		Then the title should be Market Access :: Homepage
		Then the page should not have any accessibility violations
