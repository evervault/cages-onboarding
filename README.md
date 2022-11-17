# Cloning this repo

To clone this repo, including its submodules, you can run `git clone git@github.com:evervault/cages-onboarding.git --recurse-submodules`

Alternatively you can clone as normal, and then configure the submodule after:

```
git clone git@github.com:evervault/cages-onboarding.git
git submodule init
git submodule update
```

# evervault-cage-docs

## Quickstart
To get started with Cages, you’ll need a server and a Dockerfile. If you don’t have one already, then you can use our Cage in this repo as an example.

You will also need an Evervault account. If you haven’t signed up yet, you can do so here! Once signed up, retrieve the API key of your chosen Evervault app, and pass it as the EV_API_KEY environment variable when running CLI commands.

## Setting up your local environment
Before we can deploy our Cage, we’ll need to install the Evervault Cage CLI:

`CAGE_CLI_FORCE_INSTALL=1 curl https://cage-build-assets.evervault.com/cli/install -sL | sh`

Once the installation script has completed, you should have access to the ev-cage command.

`ev-cage --version`

Now we can initialize your service locally into a Cage. This will reserve the Cage name within your Evervault team, so that you can deploy your service. 
For our first Cage, we’ll enable some features which help us see what’s happening inside the enclave, namely: debug mode and network egress. To do that, we just need to run the following command:

```shell
ev-cage init --name my-first-cage --debug --egress \
-f <PATH_TO_YOUR_DOCKERFILE>
```

This command will output a `cage.toml` file containing the configuration specified for your Cage. It should look something like this:


```toml
name = "my-first-cage"
uuid = "<cage_uuid>"
app_uuid = "<app_uuid>"
team_uuid = "<team_uuid>"
debug = true
dockerfile = "<path_to_your_dockerfile>"

[egress]
enabled = true

[signing]
certPath = "<current_directory>/cert.pem"
keyPath = "<current_directory>/key.pem"
```

You may edit this toml file any time you wish to reconfigure your Cage.
Building your Cage

Now that we have our cage.toml, we can build our Cage. The build command will convert the service’s Dockerfile into a Cage compatible Enclave Image File (eif). Because our cage.toml is in the current directory, we can simply run:

`ev-cage build --write`

_Note: the first build will be slow (approx. 2mins) as the CLI has to build several Docker images. Each subsequent build should be faster once the images have been cached._

Because we have provided the `--write` flag, the CLI will append our latest Cage build’s attestation measures to the `cage.toml`. This will help with tracking changes in attestation measures within source control.

Our `cage.toml` should have a section that looks something like this at the end of it:

```shell
[attestation]
HashAlgorithm = "Sha384 { ... }"
PCR0 = "8576aa759528d6dc82b6a35504edf491bcf245266acb5745f7f15801e15988a5abbc8c637af3edeb96efcbe8e8a433a1"
PCR1 = "bcdf05fefccaa8e55bf2c8d6dee9e79bbff31e34bf28a99aa19e6b29c37ee80b214a414b7607236edf26fcb78654e63f"
PCR2 = "4ffe3d8b0211341c9eac73abccfcfed63f694a4a84b7758e70d1941d0ac6c0a7091c7860aa1ff2e4d39bbdd2b220608f"
PCR8 = "9f357c7861268d124143701d30fbd0401f4f2854db7698851c51a08bc719abe9cc89645324d24cdbac1f216b482d6ad8"
```

These attestation measures are how we will verify the integrity of the code after we have deployed it. Attestation lets us trust a remote server before we share any sensitive data with them. You can read more about attestation for Cages in the Cages Overview Document.

The build command will also have created two files: enclave.eif and ev-user.Dockerfile. The enclave.eif file is the image that the Cage will run in the trusted execution environment, and the ev-user.Dockerfile is the Dockerfile that was used to generate it.
Deploying your Cage
To deploy your Cage using an existing EIF, all you need to do is run:

```shell
ev-cage deploy --eif-path <path_to_your_eif>
```

_Note: you can build a fresh eif for a deployment by omitting the eif-path argument._

The CLI will track your Cage deployment. Once the deployment has stabilised, you should see a log which includes the domain for your Cage:

Cage deployed successfully. Your Cage is now available at `https://<cage_name>.<app_uuid>.cages.evervault.com`

You can now call your Cage over the internet! If you deployed the Evervault hello world cage, you can use the following curl command to try it out:

```shell
curl https://<cage_name>.<app_uuid>.cages.evervault.com/hello -H 'Api-Key: <your_api_key>' -k
```

And you should see an echo response from your Cage:

```json
{ "response": "Hello from enclave" }
```


## Known issues

Docker Python base images using slim-buster cause the build process to hang on the runtime install.
If installing Python packages using pip, it is recommended to use a virtual environment in your container. This is to ensure the correct Python binary is run in your entrypoint.
Cages don’t support the WORKDIR Dockerfile directive.


## CLI Reference
The `EV_API_KEY` environment variable must be set to the API key of the app you wish to deploy Cages into. 

## __build__
The build command mirrors the docker build command but produces an enclave image file (eif) as output instead of a docker image. The build command requires a cage.toml to be available when creating an enclave image file. This can be generated using the init command.

#### Usage
```ev-cage build [OPTIONS] [CONTEXT_PATH]```

#### Args
`CONTEXT_PATH:` Path to use for docker context, defaults to the current directory.

#### Options
`-c, --config <CONFIG>:` Path to the cage.toml file. Defaults to `./cage.toml`

`-f, --file <DOCKERFILE>:` Path to the dockerfile to use for the Cage. Defaults to ./Dockerfile

`-o, --output <OUTPUT_DIR>:` Path to directory to save the processed dockerfile and eif.

`--private-key <PRIVATE_KEY>:` Private key to be used when signing the eif.

`--signing-cert <CERTIFICATE>:` Certificate corresponding to the private key.

`-w, --write:` Write the latest attestation information to the cage.toml.

`--build-arg:` Build time arguments to provide to docker

##  cert
The parent command for generating enclave signing certificates.
cert new
Create a new Cage signing certificate and private key.

#### Usage
`ev-cage cert new [OPTIONS]`

#### Options
`-o, --output <OUTPUT_DIR>:` Path to the directory where the credentials will be saved. Defaults to the current directory.

`--subj <SUBJECT>:` Defining the certificate’s distinguished name e.g. `/CN=EV/C=IE/ST=LEI/L=DUB/O=Evervault/OU=Eng`. If not given a generic Cage subject is given.

## delete
Delete the Cage defined in a given cage.toml

#### Usage
`ev-cage delete [OPTIONS]`

#### Options

`-c, --config <CONFIG>:` Path to the cage.toml config file. Default to ./cage.toml

## deploy
Deploy the Cage defined in your cage.toml file. By default, the deploy command will ignore any prebuilt EIFs and begin a fresh Cage build. You can prevent this by providing a path to an existing EIF using the --eif-path option.

#### Usage
`ev-cage deploy [OPTIONS] [CONTEXT_PATH]`

#### Args
`<CONTEXT_PATH>:` Path to use for the docker context. Defaults to the current directory.

#### Options

 `-c, --config <CONFIG>:` Path to cage.toml config file [default: ./cage.toml]

`--eif-path <EIF_PATH>:` Path to EIF for Cage. Will not build if EIF is provided

`-f, --file <DOCKERFILE>`:` Path to Dockerfile for Cage. Will override any dockerfile specified in the cage.toml file [default: ./Dockerfile]

`--private-key <PRIVATE_KEY>: `Private key used to sign the enclave image file

`--quiet: Disable verbose output`

`--signing-cert <CERTIFICATE>:` Certificate used to sign the enclave image file

`-w, --write:` Write latest attestation information to cage.toml config file

`--build-arg:` Build time arguments to provide to docker


## describe
Get the PCRs of an existing EIF.

#### Usage
`ev-cage describe [OPTIONS] [EIF_PATH]`

#### Args
`<EIF_PATH>:` Path to the EIF to describe. [default: ./enclave.eif]

#### Options
`-h, --help:` Print help information

`--json:` Toggle JSON output for stdout

`-v, --verbose:` Toggle verbose output

## init
Create a Cage and initialize a Cage.toml in the current directory.

#### Usage
`ev-cage init [OPTIONS] --name <CAGE_NAME>`

#### Options

`--debug:` Debug setting for the Cage. When debug is enabled, you can access logs from within the Enclave.

`--egress-enabled:` Flag to enable network egress from your Cage

`-f, --file <DOCKERFILE>:` Dockerfile to build the Cage

`--generate-signing:` Flag to enable cert generation during init. This will use the default certificate

`-h, --help:` Print help information

`--json:` Toggle JSON output for stdout

`--name <CAGE_NAME>:` Name of Cage to deploy

`-o, --output <OUTPUT_DIR>:` Directory to write the Cage toml to. Defaults to the current directory [default: .]

`--private-key <KEY_PATH>:` Path to the signing key to use for the Cage

`--signing-cert <CERT_PATH>:` Path to the signing cert to use for the Cage

`-v, --verbose:` Toggle verbose output

## list
The parent command for pulling Cage related information.

### list cages
List your Cages

#### Usage
`ev-cage list cages [OPTIONS]`

#### Options

`-h, --help:` Print help information

`--json:` Toggle JSON output for stdout

`-v, --verbose:` Toggle verbose output

### list deployments
List the deployments for your Cage.
#### Usage

`ev-cage list deployments [OPTIONS] --cage-uuid <CAGE_UUID>`

#### Options

`--cage-uuid <CAGE_UUID>:` The cage uuid to get deployments for
    
`-h, --help:` Print help information

`--json:` Toggle JSON output for stdout

`-v, --verbose:` Toggle verbose output
