import { it } from '@paulmillr/jsbt/test.js';
import { PLATFORMS } from './platform.ts';
import { deepStrictEqual, strictEqual } from 'node:assert';

const { shake256 } = PLATFORMS.noble || Object.values(PLATFORMS)[0];

it('SHAKE256 state can be serialized and restored', () => {
    const chunk1 = new Uint8Array(1000);
    const chunk2 = new Uint8Array(2000);

    for (let i = 0; i < chunk1.length; i++)
        chunk1[i] = i & 0xff;

    for (let i = 0; i < chunk2.length; i++)
        chunk2[i] = (i * 7) & 0xff;

    // Normal uninterrupted hash
    const direct = shake256.create({ dkLen: 64 });
    direct.update(chunk1);
    direct.update(chunk2);

    const expected = direct.digest();

    // Hash with checkpoint
    const checkpointed = shake256.create({ dkLen: 64 });
    checkpointed.update(chunk1);

    const state = checkpointed.saveState();

    strictEqual(state.length, 220);

    const restored = shake256.create({ dkLen: 64 });
    restored.loadState(state);
    restored.update(chunk2);

    const actual = restored.digest();

    deepStrictEqual(actual, expected);
});

const positions = [
    0,
    1,
    135,
    136,
    137,
    271,
    272,
    273,
    1000,
];

it('SHAKE256 store and restore state works with a range of chunk sizes', () => {
    for (const n of positions) {
        const chunk1 = new Uint8Array(n);
        const chunk2 = new Uint8Array(500);

        for (let i = 0; i < chunk1.length; i++)
            chunk1[i] = i & 0xff;

        for (let i = 0; i < chunk2.length; i++)
            chunk2[i] = (i * 13) & 0xff;

        const expected = shake256
            .create({ dkLen: 64 })
            .update(chunk1)
            .update(chunk2)
            .digest();

        const first = shake256.create({ dkLen: 64 });
        first.update(chunk1);

        const checkpoint = first.saveState();

        strictEqual(checkpoint.length, 220);

        const second = shake256.create({ dkLen: 64 });
        second.loadState(checkpoint);
        second.update(chunk2);

        const actual = second.digest();

        deepStrictEqual(
            actual,
            expected,
            `checkpoint failed at position ${n}`
        );
    }
})

it.runWhen(import.meta.url);
