self.onmessage = function(event) {
    const { code, context } = event.data;
    
    // Execute the instrumented code
    eval(code); 
    
    // Send the snapshots back to the main thread
    self.postMessage({ snapshots: context.snapshots });
};