package com.cloudogu.smeagol.wiki.infrastructure;

import com.cloudogu.smeagol.wiki.domain.CommitId;

/*
* Exception for malformed commit ids.
*/
public class MalformedCommitIdException extends RuntimeException {

    private final CommitId commitId;

    public MalformedCommitIdException(CommitId commitId) {
        this.commitId = commitId;
    }

    public CommitId getCommitId() {
        return commitId;
    }
}
