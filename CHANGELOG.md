# Changelog

## [Unreleased]

## [3.2.0]
### Updated
- Typescript definitions to include test harness report
- Throw a nicer error when a suite is intialised with somethingn other than an instance of Testable

## [3.1.0]
### Added
- Added locals for sharing state between tests

## [3.0.10]
### Changed
- Improved readme

## [3.0.9]
### Changed
- Improved readme

## [3.0.8]
### Fixed
- Pattern option should not have been path.resolved

## [3.0.7]
### Added
- Launch script documentation

### Changed
- Use bundled launch script

## [3.0.6]
### Added
- Launch script (work in progress)

## [3.0.5]
### Fixed
- Throwing a non-error from tests breaks various reporters
- Replaced deprecated assert.equal with assert.strictEqual
- SpecReporter colours could not be disabled

### Added
- Discover tripitaka badge
- SpecReporter tests
