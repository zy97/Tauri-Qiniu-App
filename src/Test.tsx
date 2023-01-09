import { useAsyncEffect } from "ahooks";

function Test() {
    useAsyncEffect(async function* () {
        console.log('进入useAsyncEffect');
        // const unlisten = setInterval(() => {
        //   console.log('计时器还活着');
        // }, 1000);
        yield;
        // clearInterval(unlisten);
        console.log('清理useAsyncEffect');
    }, []);
    return (
        <div>
            test1
        </div>
    );
}

export default Test;