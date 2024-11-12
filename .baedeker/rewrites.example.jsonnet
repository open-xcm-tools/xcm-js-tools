function(prev, repoDir)
(import 'baedeker-library/ops/rewrites.libsonnet').rewriteNodePaths({
	'bin/polkadot':'%s/../bin/polkadot' % repoDir,
	'bin/assethub':'%s/../bin/polkadot-parachain' % repoDir,
})(prev)