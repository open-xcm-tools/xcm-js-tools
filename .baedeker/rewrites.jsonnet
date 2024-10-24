function(prev, repoDir)
(import 'baedeker-library/ops/rewrites.libsonnet').rewriteNodePaths({
	'bin/polkadot':'../bin/polkadot',
	'bin/assethub':'../bin/polkadot-parachain',
})(prev)