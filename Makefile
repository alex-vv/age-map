BUMP ?= $(if $(filter patch minor major,$(MAKECMDGOALS)),$(filter patch minor major,$(MAKECMDGOALS)),minor)

.PHONY: release patch minor major

release:
	@bash scripts/release.sh "$(BUMP)"

patch minor major:
	@:
