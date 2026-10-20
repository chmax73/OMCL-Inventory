/**
 * Prueft, dass die Oberflaeche nur den vom Server gelieferten Benutzer nutzt.
 * Ein alter Browser-Speichereintrag darf keinen Dummy-Admin mehr anzeigen.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { UserProvider, useUser } from "./UserContext";

function CurrentUserLabel() {
    const { user } = useUser();
    return <span>{user ? `${user.name} (${user.rolle})` : "Nicht angemeldet"}</span>;
}

test("ein serverseitig gepruefter Benutzer erscheint im Context", () => {
    const html = renderToStaticMarkup(
        <UserProvider initialUser={{ id: "auth-user-id", name: "Test Admin", rolle: "admin" }}>
            <CurrentUserLabel />
        </UserProvider>,
    );
    assert.match(html, /Test Admin \(admin\)/);
});

test("ohne Server-Benutzer bleibt die Oberflaeche abgemeldet", () => {
    const html = renderToStaticMarkup(
        <UserProvider initialUser={null}>
            <CurrentUserLabel />
        </UserProvider>,
    );
    assert.match(html, /Nicht angemeldet/);
});
