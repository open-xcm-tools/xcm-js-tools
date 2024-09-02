export default {
  runtime: {
    DryRunApi: [
      {
        version: 1,

        methods: {
          dry_run_call: {
            description: 'XCM dry-run call',
            params: [
              {
                name: 'origin',
                type: 'OriginCaller',
              },

              {
                name: 'call',
                type: 'Call',
              },
            ],
            type: 'Result<DryRunCallEffects, DryRunError>',
          },

          dry_run_xcm: {
            description: 'XCM dry-run xcm',
            params: [
              {
                name: 'origin_location',
                type: 'XcmVersionedLocation',
              },

              {
                name: 'xcm',
                type: 'XcmVersionedXcm',
              },
            ],
            type: 'Result<DryRunXcmEffects, DryRunError>',
          },
        },
      },
    ],
  },
  types: {
    DryRunCallEffects: {
      execution_result:
        'Result<FrameSupportDispatchPostDispatchInfo, SpRuntimeDispatchErrorWithPostInfo>',
      emitted_events: 'Vec<Event>',
      local_xcm: 'Option<XcmVersionedXcm>',
      forwarded_xcms: 'Vec<(XcmVersionedLocation, Vec<XcmVersionedXcm>)>',
    },

    DryRunXcmEffects: {
      execution_result: 'StagingXcmV4TraitsOutcome',
      emitted_events: 'Vec<Event>',
      forwarded_xcms: 'Vec<(XcmVersionedLocation, Vec<XcmVersionedXcm>)>',
    },

    DryRunError: {
      _enum: {
        Unimplemented: 'Null',
        VersionedConversionFailed: 'Null',
      },
    },
  },
};
