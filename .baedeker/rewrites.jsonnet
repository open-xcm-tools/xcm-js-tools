function(prev, repoDir)
(import 'baedeker-library/ops/rewrites.libsonnet').rewriteNodePaths({
	'bin/polkadot':{dockerImage:'uniquenetwork/builder-polkadot:release-v1.0.0'},
	'bin/assethub':{dockerImage:'parity/polkadot-parachain:1.14.0'},
})(prev)