#!/usr/bin/env bash
set -euo pipefail

VERSIONS_PLUGIN="org.codehaus.mojo:versions-maven-plugin:2.22.0"

bump="${1:-minor}"
case "$bump" in
    patch | minor | major) ;;
    *)
        echo "BUMP must be one of: patch, minor, major (got: '$bump')" >&2
        exit 1
        ;;
esac

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean. Commit or stash changes first." >&2
    exit 1
fi

current="$(awk -F'[<>]' '/<version>/{print $3; exit}' pom.xml)"
if [[ ! "$current" =~ -SNAPSHOT$ ]]; then
    echo "Current pom version '$current' is not a -SNAPSHOT version." >&2
    exit 1
fi

release="${current%-SNAPSHOT}"
IFS='.' read -r major minor patch <<<"$release"

case "$bump" in
    patch) next="$major.$minor.$((patch + 1))" ;;
    minor) next="$major.$((minor + 1)).0" ;;
    major) next="$((major + 1)).0.0" ;;
esac
next_snapshot="${next}-SNAPSHOT"
tag="v${release}"

if git rev-parse -q --verify "refs/tags/${tag}" >/dev/null; then
    echo "Tag ${tag} already exists." >&2
    exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"

echo "bump:    $bump"
echo "release: $release (tag ${tag})"
echo "next:    ${next_snapshot}"

./mvnw -N "${VERSIONS_PLUGIN}:set" -DnewVersion="${release}" -DgenerateBackupPoms=false
git commit -am "Release ${release}"
git tag "${tag}"

echo "Building release ${release} (with tests)…"
if ! ./mvnw package; then
    echo "Build failed after tag ${tag}. Nothing was pushed." >&2
    echo "To clean up: git tag -d ${tag} && git reset --hard HEAD~1" >&2
    exit 1
fi

./mvnw -N "${VERSIONS_PLUGIN}:set" -DnewVersion="${next_snapshot}" -DgenerateBackupPoms=false
git commit -am "Prepare ${next_snapshot}"

git push origin "${branch}"
git push origin "refs/tags/${tag}"

echo "Done: released ${release} (tag ${tag}); development continues on ${next_snapshot}."
