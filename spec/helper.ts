export function testAsync(runAsync: Function) {
    return function (done: Function) {
        runAsync().then(
            done,
            function (e: Error) {
                fail(e);
                done();
            }
        );
    };
}
