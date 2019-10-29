# Market Access Frontend

The frontend component of the Market Access project. This is a Node.js project with Express using Nunjucks templates.

It uses as many [GOVUK Frontend components](https://design-system.service.gov.uk/components/) as possible (also Nunjucks).

The CSS is produced with SASS to enable re-use of the [GOVUK Frontend styles](https://design-system.service.gov.uk/styles/) for many of the layout and colours etc.

This project relies on the [Market Access API](https://github.com/uktrade/market-access-api) project to function, so you will need to either have [Python installed](https://www.python.org/downloads/) and run it locally or use [Docker](https://www.docker.com/get-started) to run the images.

Once you have the API running you are ready to start the app.

## Getting started

First you need to install the dependencies:
```
npm install
```

This project has a dependency of [Redis](https://redis.io/) which you can [download](https://redis.io/download) to run locally or run via docker:

```
docker run --name redis -d -p 6379:6379 redis
```

The app is controlled with environment variables so you will also need some set. There is a [.env.template](/.env.template) file which can be used to create a `.env` file. You can use something like [direnv](https://direnv.net/) to read the .env file and automatically apply the env vars when you change into the directory. Alternativly you can make the `.env` file and then apply the changes locally:
```
source .env
```

The user authentication is handled by the [DIT SSO](https://github.com/uktrade/staff-sso) where a token is stored and used for authorization of user end points. There are some machine to machine APIs that are called on the backend and we use [Hawk](https://github.com/hueniverse/hawk) to secure those calls. In dev mode you can turn off Hawk and bypass the SSO using the `.env` settings

You can also run a [mock-sso](https://github.com/uktrade/mock-sso) client to run the app near a produciton mode without the hastle of logging in. Again configure your `.env` file accordingly.

Now you are ready to start the app...

### Starting up...

There are two ways to start the app: dev mode or prod mode.

#### Dev mode

In dev mode the files will be watched for changes and either Node.js will be restarted when `.js` files are changed or SASS will be re-compiled to CSS when `.scss` are changed.

To run dev mode:
```
npm run watch
```

#### Prod mode

In prod mode all the app files are copied to the `/dist` folder and the client JS, CSS and images are [revved](https://www.stevesouders.com/blog/2008/08/23/revving-filenames-dont-use-querystring/). When running the templates are cached and an expires header is set to 2 years for the static assets. The JS and CSS are bundled and minified before being revved. The npm dependencies are also installed using the `-- production` flag.

To start the app in prod mode:

```
npm run dist
```

This will run the prod build tasks and then start the app.


## Making a release

1.	Checkout the develop branch. `git checkout develop`
2. Run `npm version` to see the current version and decide what the new verison number should be - a major, minor or patch bump
3. Create a new branch with the new release number, for example, `git checkout -b release-v3.2.1`
4. Depending on what you decide the next version numer will be, run one of these:
 _Make sure you have a local instance of REDIS or the tests will fail_

  - `npm version major`
  - `npm version minor`
  - `npm version patch`

  

5. Now the package.json version should match the branch name, the commit will have been made to git, a tag created and it will have attempted to push to github
   If you see an error in the console **do not run the `npm version` command again**. The error is simply because the remote branch does not exist, just copy the command from the error which will do the push to github and setup the remote
6. Create a PR in github with the new branch and wait for the checks to pass
7. Once the checks have all passed then you can either merge to master or release to an environment to test and then merge to master
8. Once it has been merged to master you can start deploying to staging and then production
9. Whilst the deployments are happening, run `git checkout master` and then `git pull` to get the latest
10. Run `npm run tag-master` which will create a tag of latest commit to master and push the tag to the remote
11. Merge master to develop and push to the remote (will require you to have permissions to do this)
	`git checkout develop`
	`git merge master`
	`git push`

The relese is now done.
