# Generated by jsangmeister on 2021-03-22 12:44

import jsonfield.encoder
import jsonfield.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assignments", "0021_assignmentvote_user_token_3"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignmentpoll",
            name="is_pseudoanonymized",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="assignmentpoll",
            name="entitled_users_at_stop",
            field=jsonfield.fields.JSONField(
                dump_kwargs={
                    "cls": jsonfield.encoder.JSONEncoder,
                    "separators": (",", ":"),
                },
                load_kwargs={},
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="assignmentpoll",
            name="onehundred_percent_base",
            field=models.CharField(
                choices=[
                    ("YN", "Yes/No per candidate"),
                    ("YNA", "Yes/No/Abstain per candidate"),
                    ("Y", "Sum of votes including general No/Abstain"),
                    ("valid", "All valid ballots"),
                    ("cast", "All casted ballots"),
                    ("entitled", "All entitled users"),
                    ("disabled", "Disabled (no percents)"),
                ],
                max_length=8,
            ),
        ),
        migrations.RenameField(
            model_name="assignmentpoll",
            old_name="db_votescast",
            new_name="votescast",
        ),
        migrations.RenameField(
            model_name="assignmentpoll",
            old_name="db_votesinvalid",
            new_name="votesinvalid",
        ),
        migrations.RenameField(
            model_name="assignmentpoll",
            old_name="db_votesvalid",
            new_name="votesvalid",
        ),
    ]