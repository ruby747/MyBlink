// Add this file to the iOS App target (not the Widget target).

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedDefaults, NSObject)
RCT_EXTERN_METHOD(setMemos:(NSString *)json)
@end

