local
m = import 'baedeker-library/mixin/spec.libsonnet',
;

function(relay_spec)

local relay = {
	name: 'relay',
	bin: 'bin/polkadot',
	validatorIdAssignment: 'staking',
	spec: {Genesis:{
		chain: relay_spec,
		modify:: m.genericRelay($, hrmp = std.join([], [
			[[$.parachains[a].paraId, $.parachains[b].paraId, 8, 512], [$.parachains[b].paraId, $.parachains[a].paraId, 8, 512]],
			for [a, b] in [
				// ['unique', 'acala'],
				// ['unique', 'moonbeam'],
				// ['unique', 'statemint'],
				// ['unique', 'astar'],
				// ['unique', 'polkadex'],
			]
		])),
	}},
	nodes: {
		[name]: {
			bin: $.bin,
			wantedKeys: 'relay',
		},
		for name in ['alice', 'bob', 'charlie', 'dave', 'eve', 'ferdie', 'gregory']
	},
};

local assethub = {
        name: 'assethub',
        bin: 'bin/assethub',
        paraId: 1004,
        spec: {Genesis:{
                chain: 'asset-hub-westend-local',
                modify:: m.genericPara($),
        }},
        nodes: {
                [name]: {
                        bin: $.bin,
                        wantedKeys: 'para',
                        expectedDataPath: '/parity',
			parentConnection: 'internal-samedir',
			extraArgs: ['--rpc-methods', 'unsafe']
                },
                for name in ['alice', 'bob']
        },
};

relay + {
	parachains: {
		[para.name]: para,
		for para in [assethub]
	},
}
