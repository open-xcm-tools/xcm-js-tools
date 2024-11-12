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
        modify:: bdk.mixer([
            m.genericRelay($),
            {
                genesis+: {
                    runtimeGenesis+: {
                        runtime+: {
                            configuration+: {
                                config+: {
                                    async_backing_params+: {
                                        allowed_ancestry_len: 3,
                                        max_candidate_depth: 4,
                                    },
                                    scheduling_lookahead:5,
                                    max_validators_per_core:2,
                                    minimum_backing_votes:2,
                                    needed_approvals:2,
                                    on_demand_cores:5,
                                },
                            },
                        },
                    },
                },
            },
        ]),
    }},
    nodes: {
        [name]: {
            bin: $.bin,
            wantedKeys: 'relay',
            expectedDataPath: '/parity',
        },
        for name in ['alice', 'bob', 'charlie', 'dave', 'eve']
    },
};

local assethubA = {
    name: 'assethubA',
    bin: 'bin/assethub',
    paraId: 2001, 
    spec: {Genesis:{
        chain: 'asset-hub-westend-local',
        modify:: m.genericPara($),
    }},
    nodes: {
        [name]: {
            bin: $.bin,
            wantedKeys: 'para',
            parentConnection: 'internal-samedir',
            expectedDataPath: '/parity',    
            extraArgs: [
                '-lxcm=trace',
            ],
        },
        for name in ['alice', 'bob']
    },
};

local assethubB = assethubA {
    name: 'assethubB',
    paraId: 2002,
};

local assethubC = assethubA {
    name: 'assethubC',
    paraId: 2003,
};

relay + {
    parachains: {
        [para.name]: para,
        for para in [assethubA, assethubB, assethubC]
    },
}