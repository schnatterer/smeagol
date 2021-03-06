package com.cloudogu.smeagol.wiki.usecase;

import com.cloudogu.smeagol.AccountService;
import com.cloudogu.smeagol.wiki.domain.*;
import de.triology.cb.CommandHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import static com.cloudogu.smeagol.wiki.usecase.Commits.createNewCommit;

/**
 * Handler for {@link EditPageCommand}.
 */
@Component
public class EditPageCommandHandler implements CommandHandler<Page, EditPageCommand> {

    private final ApplicationEventPublisher publisher;
    private final PageRepository repository;
    private final AccountService accountService;

    @Autowired
    public EditPageCommandHandler(ApplicationEventPublisher publisher, PageRepository repository, AccountService accountService) {
        this.publisher = publisher;
        this.repository = repository;
        this.accountService = accountService;
    }

    @Override
    public Page handle(EditPageCommand command) {
        Path path = command.getPath();
        Page page = repository.findByWikiIdAndPath(command.getWikiId(), path)
                .orElseThrow(() -> new PageNotFoundException(path));

        Commit commit = createNewCommit(accountService, command.getMessage());
        page.edit(commit, command.getContent());

        Page modifiedPage = repository.save(page);

        publisher.publishEvent(new PageModifiedEvent(modifiedPage));

        return modifiedPage;
    }
}
