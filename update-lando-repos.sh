#!/usr/bin/env bash

for dir in */; do
  cd $dir
  plugin=$(echo $dir | rev | cut -c2- | rev)
  # Capitalize first letter of $plugin
  capitalized_plugin=$(tr '[:lower:]' '[:upper:]' <<< ${plugin:0:1})${plugin:1}
  version=$(cat package.json | jq -r '.version')

  # Install new dependencies, get rid of old
  npm remove vuepress @lando/vuepress-theme-default-plus
  npm install vitepress @lando/vitepress-theme-default-plus

  # Change docs tasks in package.json scripts
  find package.json -type f -exec sed -i '' 's/vuepress dev docs --clean-cache --clean-temp/vitepress dev docs/g' {} +
  find package.json -type f -exec sed -i '' 's/vuepress build docs/vitepress build docs/g' {} +

  # Update .eslintignore
  find .eslintignore -type f -exec sed -i '' 's/.temp/temp/g' {} +
  find .eslintignore -type f -exec sed -i '' 's/.cache/cache/g' {} +
  echo "!.vitepress" >> .eslintignore

  # Update .github/workflows/pr-docs-test to npm run lint
  find .github/workflows/pr-docs-tests.yml -type f -exec sed -i '' 's/docs:lint/lint/g' {} +
  find .github/workflows/pr-docs-tests.yml -type f -exec sed -i '' 's/unit-tests/docs-tests/g' {} +
 
  # Standardize our .gitignores
  cp ../.gitignore .gitignore 
 
  # Make sure .eslintrc.json has correct require-jsdoc attribute
  cp ../.eslintrc.json docs/.eslintrc.json

  # Setup .vitepress folder
  mkdir -p docs/.vitepress/theme
  cp ../config.mjs docs/.vitepress/config.mjs
  
  # Replace dotnet with plugin name
  find docs/.vitepress/config.mjs -type f -exec sed -i '' "s/dotnet/$plugin/g" {} +
  find docs/.vitepress/config.mjs -type f -exec sed -i '' "s/Dotnet/$capitalized_plugin/g" {} +
  cp ../index.mjs docs/.vitepress/theme/index.mjs

  # Move docs/.vuepress/public to docs/public
  mv docs/.vuepress/public docs/public
  rm -rf docs/.vuepress

  # Update dist path in netlify.toml
  find netlify.toml -type f -exec sed -i '' 's/.vuepress/.vitepress/g' {} +

  # Add team.md and install.md to docs
  cp ../install.md docs/install.md
  cp ../team.md docs/team.md

  # Replace any dotnet references with plugin name
  find docs/install.md -type f -exec sed -i '' "s/dotnet/$plugin/g" {} +
  find docs/install.md -type f -exec sed -i '' "s/Dotnet/$capitalized_plugin/g" {} +
  find docs/team.md -type f -exec sed -i '' "s/dotnet/$plugin/g" {} +
  find docs/team.md -type f -exec sed -i '' "s/Dotnet/$capitalized_plugin/g" {} +
  
  # Update/standardize support.md
  cp ../support.md docs/support.md
  find docs/support.md -type f -exec sed -i '' "s/Dotnet/$capitalized_plugin/g" {} +

  # Update/standardize development.md
  cp ../development.md docs/development.md
  find docs/development.md -type f -exec sed -i '' "s/Dotnet/$capitalized_plugin/g" {} +
  find docs/development.md -type f -exec sed -i '' "s/dotnet/$plugin/g" {} +

  # Update/standardize netlify.toml
  cp ../netlify.toml netlify.toml
  find netlify.toml -type f -exec sed -i '' "s/dotnet/$plugin/g" {} +

  # Remove docs/README.md
  rm docs/README.md

  # Remove content after ## Custom Installation
  sed '/^## Custom Installation/,$d' docs/index.md >> tmpfile && mv tmpfile docs/index.md
  sed '/^## Custom Installation/,$d' docs/getting-started.md >> tmpfile && mv tmpfile docs/getting-started.md

  php ../str_replace.php $dir

#   # Switch 3-dev to 3-dev-slim
#   find .github/workflows -type f -exec sed -i '' 's/3-dev/3-dev-slim/g' {} +

#   # replace yarn with node run in netlify.toml
#   find netlify.toml -type f -exec sed -i '' 's/yarn/npm run/g' {} +

#   # replace yarn with node run in package.json
#   find package.json -type f -exec sed -i '' 's/yarn/npm run/g' {} +

#   # remove bundled dependencies block from package.json
#   find package.json -type f -exec sed -i '' '/bundledDependencies/,/]/d' {} +

#   # Add yarn.lock to .gitignore
#   echo "yarn.lock" >> .gitignore

#   # remove yarn.lock
#   rm yarn.lock

#   # run npm install to generate package-lock.json
#   npm install

#   # Add instructions
#   find docs -type f -exec sed -i '' 's/yarn add/npm install/g' {} +


#   # Modify changelog
#   # new_version=$(awk -F. -v minor=1 -v patch=0 '{print $1, $2+minor, patch}' <<< "$version" | tr ' ' '.')
#   new_version="1.0.0"
#   echo "## v${new_version} - [December 7, 2023](https://github.com/lando/$plugin/releases/tag/v${new_version})
#     * Dialed fully for \`lando update\`
# " > changelog-update.md
#   cat CHANGELOG.md >> changelog-update.md
#   mv changelog-update.md CHANGELOG.md

#   rm *.bak
#   rm .github/workflows/*.bak

  # Checkout new branch
  git checkout -b vitepress-update

  git add .
  git commit -m "Initial vitepress migration.";
  git push
  gh pr create --fill
  sleep 2
  cd ..
done