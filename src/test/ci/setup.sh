#!/bin/bash

paths=( ./output/screenshots ./output/accessibility-reports ./output/test-reports/cucumber )

for i in "${paths[@]}"
do
	if [ -d "$i" ]; then
		rm -r "$i";
	fi

	mkdir -p "$i";
done
